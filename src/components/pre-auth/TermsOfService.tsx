// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Link } from 'react-router-dom';

/* ant imports */
import { Typography } from 'antd';

/* codePost imports */
import { SUPPORT_URL } from '../../config';
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

class TermsOfService extends React.Component<IProps> {
  public componentDidMount() {
    window.scrollTo(0, 0);
  }

  public render() {
    return (
      <PreAuthLayout isLoggedIn={this.props.isLoggedIn}>
        <div>
          <Typography.Title level={1}>Terms of Service</Typography.Title>
          <Typography.Title level={2}>License (RU-NCL)</Typography.Title>
          <Typography.Paragraph>
            Use of codePost is governed by the Rutgers Non-commercial License (RU-NCL). The full license text is
            available in the repository at{' '}
            <a
              className="text-link"
              href="https://github.com/rutgers-lcsr/codePost-ui/blob/master/LICENSE"
              target="_blank"
              rel="noreferrer"
            >
              LICENSE
            </a>
            .
          </Typography.Paragraph>
          <Typography.Paragraph>
            In summary (non-binding): RU-NCL allows academic and personal use and prohibits commercial use. If there is
            any conflict between this page and the RU-NCL legal text, the RU-NCL controls.
          </Typography.Paragraph>
          <Typography.Paragraph>
            These Terms of Service govern your access to and use of codePost, including the products, features, apps,
            services, technologies, and software that we offer.
            <ul>
              <li>We will refer to these Terms of Service as our “Terms” and to our website as the “Site”.</li>
              <li>
                We will refer to codePost, LLC and its corporate affiliates, subsidiaries, and divisions as may change
                from time to time as “codePost” or “we” or “us” or “our”.
              </li>
              <li>We will refer to the services we provide, individually and collectively, as the “Services”.</li>
              <li>We will refer to you, the person or entity agreeing to these Terms, as “you” or “your”.</li>
            </ul>
          </Typography.Paragraph>
          <Typography.Title level={2}>0. Acceptance of our Terms</Typography.Title>
          <Typography.Paragraph>
            By accessing or using the Site and/or using one or more Services, you agree to these Terms. These Terms are
            a legal agreement between you and codePost. In addition, by accessing or using the Site and/or using one or
            more Services, you represent that you are over the age of sixteen (16) years old if residing in the European
            Union, fourteen (14) years old if residing in Spain or South Korea, or thirteen (13) years old if residing
            anywhere else (the “Minimum Age”). If your age exceeds the Minimum age but is under the legal age of
            majority wherever you reside, a parent or legal guardian of yours must consent to these Terms and our
            Privacy Policy. In addition, this same parent or legal guaradian must affirm that he or she accepts these
            Terms on behalf of, as well as bear all legal and financial responsibility and liability for the actions of,
            the child accessing the Site and/or using one or more Services whose age falls between the Minimum Age and
            majority. This same parent or legal guardian must expressly ratify and confirm any acts of the child and all
            users of the account corresponding to the child.
          </Typography.Paragraph>
          <Typography.Title level={2}>1. Modification</Typography.Title>
          <Typography.Paragraph>
            We may revise the Terms at any time. If we do so, and, in codePost’s sole discretion, the change is material
            under applicable law, we will notify you via posting to our website, or through other communication
            channels. If you continue to use the Site and the Services after we have informed you that the Terms have
            been modified, you are indicating to us that you agree to be bound by the modified Terms, and to license our
            Services as further discussed below.
          </Typography.Paragraph>
          <Typography.Title level={2}>2. Your Right to use the Site</Typography.Title>
          <Typography.Paragraph>
            <ol type="a">
              <li>
                Right: Subject to your compliance with the Terms, codePost grants you a personal, limited,
                non-exclusive, non-transferable, non-sub-licensable license to electronically access and use the
                Services solely as provided for in these Terms
              </li>
              <li>
                Restrictions. You will not, nor permit any other person to, do any of the following:
                <ol type="i">
                  <li>
                    access or attempt to access any other codePost systems, programs, data, or accounts that are not
                    made available for public or your use;
                  </li>
                  <li>
                    work around any technical limitations in the Site, use any tool to enable features or
                    functionalities that are otherwise disabled in the Site, or decompile, disassemble, or otherwise
                    sreverse engineer the Site except as otherwise permitted by applicable law;
                  </li>
                  <li>
                    perform or attempt to perform any actions that would interfere with the proper working of the Site,
                    prevent access to or the use of the Site by codePost’s other licensees or users, or impose an
                    unreasonable or disproportionality large load on codePost’s infrastructure;
                  </li>
                  <li>
                    frame or utilize framing techniques to enclose any trademark, logo, or other proprietary information
                    (including images, text, page layout, or form) of codePost or the Site or use any codePost trademark
                    or service marks, unless authorized to do so in writing by codePost;
                  </li>
                  <li>
                    attempt to access or search the Site or download content from the Site through the use of any
                    engine, software, tool, agent, device or mechanism (including spiders, robots, crawlers, data mining
                    tools, or the like) other than the software and/or search agents provided by codePost or other
                    generally available third-party web browsers. The codePost API may be accessed using any browser or
                    software which enables HTTP requests, to the extent that such use is within reasonable limitations.
                  </li>
                  <li>impersonate or misrepresent your affiliation with any person or entity; or</li>
                  <li>otherwise use the Site except as expressly allowed under the Terms</li>
                </ol>
              </li>
            </ol>
            No codePost Service may be reproduced, duplicated, copied, sold, resold, visited, or otherwise exploited for
            any commercial purpose without express written consent of codePost. The licenses granted by codePost
            terminate if you do not comply with these Terms.
          </Typography.Paragraph>
          <Typography.Title level={2}>3. Use of the Services</Typography.Title>
          <Typography.Paragraph>
            Areas of our Services allow you to submit, post, upload, publish, submit, transfer, link, display, or
            otherwise make available (hereinafter, "post") information, text, graphics, photograph, audio, video,
            postings, reviews, or other materials ("User Content") that may or may not be viewable by other Users. User
            Content must comply with these Terms. You retain ownership of all intellectual property rights you have in
            the User Content you post on the Service.
          </Typography.Paragraph>
          <Typography.Paragraph>
            By posting User Content on or through the Service, you grant codePost a worldwide, irrevocable, perpetual,
            non-exclusive, transferable, royalty-free license (with the right to sublicense) to use, copy, reproduce,
            process, adapt, modify, transmit, display, distribute, and otherwise exploit such User Content in any format
            or medium now known or developed in the future,{' '}
            <b style={{ fontWeight: 600 }}>
              in order to provide the Service subject to applicable law and our Privacy Policy
            </b>
            . Your User Content will not be used for publicity, advertising, or any public statements without your prior
            consent. The license granted to codePost shall survive termination of the Service or your Account, subject
            to other rights presented in the Terms. Notwithstanding the license granted to codePost in User Content and
            for avoidance of doubt, our use and retention of your personal data, including any that is contained in User
            Content, shall also be governed by and comply with the codePost Privacy Policy. You represent, warrant and
            agree that you have the necessary rights to grant us the license described in this Section for any User
            Content that you post.
          </Typography.Paragraph>
          <Typography.Paragraph>
            You agree that this license includes the right for other Users with permitted access to your User Content to
            use your User Content in conjunction with participation in the Service and as permitted through the
            functionality of the Service.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Your User Content may be viewable by other Users of the Service. You should only provide User Content that
            you are comfortable sharing with others under these Terms. codePost takes no responsibility and assumes no
            liability for any User Content that you or any other User or third-party posts. You shall be solely
            responsible for your own User Content and the consequences of posting or publishing it, and you agree that
            we are only acting as a passive conduit for your online distribution and publication of your User Content.
          </Typography.Paragraph>
          <Typography.Paragraph>
            codePost reserves the right in its sole discretion to remove or disable access to any User Content from the
            Service, suspend or terminate your account at any time, or pursue any other remedy or relief available under
            equity or law if you post any User Content that violates these Terms or we consider to be objectionable for
            any reason. You agree that codePost may proofread, summarize, or otherwise edit and/or withdraw your User
            Content (but does not assume the obligation), and you understand it remains your sole responsibility to
            monitor your User Content and ensure that such edited content is accurate and consistent with your
            representations and warranties in these Terms.
          </Typography.Paragraph>
          <Typography.Paragraph>
            codePost reserves the right to access, read, preserve, and disclose any information as we reasonably believe
            is necessary to (i) satisfy any applicable law, regulation, legal process, or governmental request, (ii)
            enforce the Terms, including investigation of potential violations hereof, (iii) detect, prevent, or
            otherwise address fraud, security, or technical issues, (iv) respond to user support requests, or (v)
            protect the rights, property or safety of codePost, its users and the public.
          </Typography.Paragraph>
          <Typography.Paragraph>
            You understand that codePost does not control, and is not responsible for, User Content, and that by using
            the Services, you may be exposed to User Content from other Users that is offensive, indecent, inaccurate,
            misleading, or otherwise objectionable. Please also note that User Content may contain typographical or
            other inadvertent errors or inaccuracies.
          </Typography.Paragraph>
          <Typography.Title level={2}>4. Our Privacy Policy</Typography.Title>
          <Typography.Paragraph>
            Your privacy is important to codePost. With this in mind, we will protect your personal information in
            accordance with our{' '}
            <Link to="/privacy" target="_blank" className="text-link">
              Privacy Policy
            </Link>
          </Typography.Paragraph>
          <Typography.Title level={2}>5. FERPA</Typography.Title>
          <Typography.Paragraph>
            This section applies only to those Users who access the Services in connection with classes offered by an
            educational agency or institution (the "School") that is subject to the Family Educational Rights and
            Privacy Act (“FERPA”). If you are a School or School representative, codePost acknowledges that School data
            may include personally identifiable information from education records that are subject to FERPA (“FERPA
            Records”). To the extent that codePost receives FERPA Records in providing the Service, you agree codePost
            functions as a “school official” as defined in 34 CFR § 99.31(a)(1)(i). Both parties agree to protect
            personally identifiable information from education records in accordance with FERPA and any applicable
            School policy. The limitations set forth in this section shall not apply to information which codePost
            receives pursuant to consent of student User’s parent or guardian or a student User who is at least 18 years
            of age or the age of majority in such User’s jurisdiction of residence. To the extent permitted by law,
            nothing contained herein shall be construed as precluding either party from releasing such information to
            the other so that each can perform its respective responsibilities. The School shall advise codePost
            whenever any students have provided consent to release information to an extent broader than as provided for
            by FERPA or any applicable School policy.
          </Typography.Paragraph>
          <Typography.Paragraph>
            The Service is not a part of or endorsed by the School. If you create a class, you represent and warrant
            that the School associated with or created for such class is valid and that you are validly affiliated with
            the School.
          </Typography.Paragraph>
          <Typography.Title level={2}>6. Data Security; Disclaimer</Typography.Title>
          <Typography.Paragraph>
            <ol type="A">
              <li>
                The security of your information is important to codePost. codePost takes reasonable administrative,
                physical, and electronic measures designed to protect you from unauthorized access, use or disclosure of
                the information that we collect from you.
              </li>
              <li>
                You agree to:
                <ol>
                  <li>Keep your codePost password and API Key secure and strictly confidential</li>
                  <li>
                    Notify us immediately and reset your password or API Key if you believe your password or API Key may
                    have become known to an unauthorized person
                  </li>
                  <li>
                    Notify us immediately if you are contacted by anyone requesting your codePost password or API Key
                  </li>
                  <li>
                    Indemnify and hold harmless codePost from and against any and all liabilities arising in any way
                    from the access to the Site by persons to whom you have provided your codePost password or API Key.
                    In addition, you are responsible for your information technology infrastructure, including
                    computers, servers, software, databases, electronic systems, and networks, whether operated by you
                    or through the use of third-party services.{' '}
                  </li>
                  <li>
                    Abide by all applicable local, state, national, and international laws and regulations in connection
                    with using the Services, including, without limitation, all laws regarding the transmission of
                    technical data exported from the United States through the Services and all privacy and data
                    protection laws, rules and regulations.{' '}
                  </li>
                </ol>
              </li>
              <li>
                Some third parties may have incidental access to your information. codePost works with other companies
                to provide information technology services to users of the Services. These companies may have access to
                codePost’s databases, but only for the purposes of providing service to codePost. For example, a third
                party (such as AWS) may obtain access to your information in an effort to update database software.{' '}
              </li>
              <li>
                Please be aware that no method of transmitting information over the Internet or storing information is
                completely secure. Accordingly, we cannot guarantee the absolute security of any information. codePost
                shall have no liability to you for any unauthorized access, use, corruption, or loss of any of your
                information, except to the extent that such unauthorized access use, corruption, or loss is due solely
                to codePost’s gross negligence or misconduct.{' '}
              </li>
            </ol>
          </Typography.Paragraph>
          <Typography.Title level={2}>7. Links to Third Party Websites or Resources</Typography.Title>
          <Typography.Paragraph>
            The Site may contain links to third-party websites or resources. We provide these links only as a
            convenience and are not responsible for the content, products or services on or available from those
            websites or resources or links displayed on such sites. You acknowledge sole responsibility for, and assume
            all risk arising from, your use of any third-party websites or resources.
          </Typography.Paragraph>
          <Typography.Title level={2}>8. Important Disclaimers</Typography.Title>
          <Typography.Paragraph>
            EXCEPT AS MAY BE OTHERWISE EXPRESSLY SET FORTH IN THESE TERMS, THE SERVICES ARE PROVIDED “AS IS,” WITHOUT
            WARRANTY OF ANY KIND. IN ADDITION TO THE DISCLAIMERS ABOVE, CODEPOST DOES NOT REPRESENT OR WARRANT THAT
            SERVICES, PRODUCTS, OR DOCUMENTATION ARE ACCURATE, COMPLETE, RELIABLE, CURRENT OR ERROR-FREE OR THAT THE
            SITE OR SERVICES OR ITS SERVERS, OR ANY APPLICATIONS ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </Typography.Paragraph>
          <Typography.Paragraph>
            YOU ACKNOWLEDGE THAT THE NATURE OF INTERNET-BASED SERVICE DELIVERY IS SUCH THAT CONFIDENTIALITY AND
            PERFORMANCE CANNOT BE COMPLETED ASSURED. WE SHALL HAVE NO LIABILITY TO YOU FOR ANY UNAUTHORIZED ACCESS, USE,
            CORRUPTION OR LOSS OF ANY OF CUSTOMER DATA, EXCEPT TO THE EXTENT THAT SUCH UNAUTHORIZED ACCESS, USE,
            CORRUPTION, OR LOSS IS DUE SOLELY TO OUR GROSS NEGLIGENCE OR MISCONDUCT.
          </Typography.Paragraph>
          <Typography.Paragraph>
            codePost is not responsible or liable for any user content hosted on the Site or in connection with our
            Services. We do not control and are not responsible for what you or other users of the Site host, transmit,
            or share on the Site and are not responsible for any offensive, inappropriate, obscene, unlawful or
            otherwise objectionable Site conduct.
          </Typography.Paragraph>
          <Typography.Paragraph>
            The Site and our Services may be temporarily unavailable from time to time for maintenance or other reasons.
            codePost assumes no responsibility for any error, omission, interruption, deletion, defect, delay in
            operation or transmission, communications line failure, data loss, theft or destruction or unauthorized
            access to, or alteration of, any communications. codePost is not responsible for any technical malfunction
            or other problems of any telephone network or service, computer systems, servers or providers, computer or
            mobile phone equipment, software, failure of email or players on account of technical problems or traffic
            congestion on the Internet or at any Site or combination thereof, including injury or damage to your or any
            other person’s computer, mobile phone, or other hardware or software, related to or resulting from using or
            downloading materials in connection with the Site or the Service.
          </Typography.Paragraph>
          <Typography.Title level={2}>9. Indemnity</Typography.Title>
          <Typography.Paragraph>
            You agree to defend, indemnify and hold harmless codePost, its affiliates, officers, directors, employees
            and agents from and against any and all claims, damages, obligations, losses, liabilities, costs or debt,
            and expenses (including but not limited to attorney’s fees) arising from (i) your use of and access to the
            codePost Site or Services; (ii) your violation of any term of these Terms of Use; (iii) your violation of
            any third-party right, including without limitation any copyright, property, or privacy right; or (iv) any
            claim that any of Your Information caused damage to a third party. This defense and indemnification
            obligation will survive these Terms and your use of the codePost Site. You hereby agree to waive the
            application of any law that may limit the efficacy of the foregoing agreement to defend and indemnify
            codePost and its affiliates, officers, directors, employees and agents.
          </Typography.Paragraph>
          <Typography.Title level={2}>10. Limitations of Liability</Typography.Title>
          <Typography.Paragraph>
            codePost shall have no liability for any loss, damage, or injury resulting from your or any third parties’
            negligence, lack of training, use or misuse, or misapplication of any Product or Service.
          </Typography.Paragraph>
          <Typography.Paragraph>
            You agree to indemnify, defend, and hold harmless codePost and its employees from any claims, damages and
            actions of any kind or nature arising from or caused by the use or misuse of any Service.
          </Typography.Paragraph>
          <Typography.Title level={2}>11. General Terms</Typography.Title>
          <Typography.Paragraph>
            These Terms constitute the entire and exclusive understanding and agreement between codePost and you
            regarding the Services, and supersede and replace any and all prior oral or written understandings or
            agreements between codePost and you regarding the Site and the Services. If for any reason a court of
            competent jurisdiction finds any provision of these Terms invalid or unenforceable, that provision will be
            enforced to the maximum extent permissible and the other provisions of these Terms will remain in full force
            and effect.
          </Typography.Paragraph>
          <Typography.Paragraph>
            You may not assign or transfer these Terms, by operation of law or otherwise, without codePost’s prior
            written consent. Any attempt by you to assign or transfer these Terms, without such consent, will be null
            and of no effect. codePost may freely assign or transfer these Terms without restriction. Subject to the
            foregoing, these Terms will bind and inure to the benefit of the parties, their successors and permitted
            assigns.
          </Typography.Paragraph>
          <Typography.Paragraph>
            All notices must be in writing and in the English language and will be deemed given only when sent by mail
            (return receipt requested), hand-delivered, sent by documented overnight delivery service to the party to
            whom the notice is directed, at its address indicated in the signature box to these Terms (or such other
            address as to which the other party has been notified), or sent by email if receipt is electronically
            confirmed.
          </Typography.Paragraph>
          <Typography.Paragraph>
            codePost’s failure to enforce any right or provision of these Terms will not be considered a waiver of those
            rights. The waiver of any such right or provision will be effective only if in writing and signed by a duly
            authorized representative of codePost. Except as expressly set forth in these Terms, the exercise by either
            party of any of its remedies under these Terms will be without prejudice to its other remedies under these
            Terms or otherwise.
          </Typography.Paragraph>
          <Typography.Paragraph>
            Neither party will be liable hereunder by reason of any failure or delay in the performance of its
            obligations hereunder on account of events beyond the reasonable control of such party, which may include
            without limitation denial-of-service attacks, strikes, shortages, riots, insurrection, fires, flood, storm,
            explosions, acts of God, war, terrorism, governmental action, labor conditions, earthquakes and material.
          </Typography.Paragraph>
          <Typography.Paragraph>
            These Terms and all matters arising out of, or relating to, these Terms will be governed by the laws of the
            State of New Jersey, without regard to its conflict of laws provisions. The sole venue for all disputes
            relating to these Terms shall be in Mercer County, New Jersey.
          </Typography.Paragraph>
          <Typography.Title level={2}>12. Contact Information</Typography.Title>
          <Typography.Paragraph>
            If you have any questions about these Terms or the Services please visit our{' '}
            <a href={SUPPORT_URL} className="text-link">
              support page
            </a>
          </Typography.Paragraph>
        </div>
      </PreAuthLayout>
    );
  }
}

export default TermsOfService;
